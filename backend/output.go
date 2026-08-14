package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"
)

func copyAtomic(ctx context.Context, source, target string, strictHash bool, progress func(float64)) (string, error) {
	in, err := os.Open(source)
	if err != nil {
		return "", err
	}
	defer in.Close()
	info, err := in.Stat()
	if err != nil {
		return "", err
	}
	temp, err := os.CreateTemp(filepath.Dir(target), ".takebinder-*.partial")
	if err != nil {
		return "", err
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)

	hasher := sha256.New()
	writer := io.Writer(temp)
	if strictHash {
		writer = io.MultiWriter(temp, hasher)
	}
	buffer := make([]byte, 4*1024*1024)
	var copied int64
	lastPercent := -1
	for {
		if err := ctx.Err(); err != nil {
			_ = temp.Close()
			return "", err
		}
		n, readErr := in.Read(buffer)
		if n > 0 {
			if _, err := writer.Write(buffer[:n]); err != nil {
				_ = temp.Close()
				return "", err
			}
			copied += int64(n)
			percent := int(float64(copied) / float64(info.Size()) * 90)
			if !strictHash {
				percent = int(float64(copied) / float64(info.Size()) * 99)
			}
			if percent != lastPercent {
				progress(float64(percent))
				lastPercent = percent
			}
		}
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			_ = temp.Close()
			return "", readErr
		}
	}
	if err := temp.Sync(); err != nil {
		_ = temp.Close()
		return "", err
	}
	if err := temp.Close(); err != nil {
		return "", err
	}
	if strictHash {
		outputHash, err := hashFile(tempPath, func(done, total int64) {
			percent := 90 + int(float64(done)/float64(total)*9)
			if percent != lastPercent {
				progress(float64(percent))
				lastPercent = percent
			}
		})
		if err != nil {
			return "", err
		}
		if outputHash != hex.EncodeToString(hasher.Sum(nil)) {
			return "", errors.New("copied file hash mismatch")
		}
	}
	if err := os.Chmod(tempPath, info.Mode().Perm()); err != nil {
		return "", err
	}
	if err := os.Chtimes(tempPath, info.ModTime(), info.ModTime()); err != nil {
		return "", err
	}
	if err := os.Rename(tempPath, target); err != nil {
		return "", err
	}
	progress(100)
	if strictHash {
		return hex.EncodeToString(hasher.Sum(nil)), nil
	}
	return "", nil
}

func hashFile(path string, progress func(done, total int64)) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return "", err
	}
	hasher := sha256.New()
	buffer := make([]byte, 4*1024*1024)
	var done int64
	for {
		n, readErr := file.Read(buffer)
		if n > 0 {
			done += int64(n)
			_, _ = hasher.Write(buffer[:n])
			progress(done, info.Size())
		}
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return "", readErr
		}
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

func (a *app) uniqueOutput(dir, requested string) (string, error) {
	a.nameMu.Lock()
	defer a.nameMu.Unlock()
	name := filepath.Base(requested)
	if name == "." || name == "" {
		return "", errors.New("invalid output name")
	}
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	if a.reserved == nil {
		a.reserved = map[string]bool{}
	}
	for index := 1; ; index++ {
		candidate := filepath.Join(dir, name)
		if index > 1 {
			candidate = filepath.Join(dir, fmt.Sprintf("%s_%d%s", base, index, ext))
		}
		key := candidate
		if runtime.GOOS == "windows" {
			key = strings.ToLower(key)
		}
		_, err := os.Lstat(candidate)
		if err == nil || a.reserved[key] {
			continue
		}
		if !errors.Is(err, os.ErrNotExist) {
			return "", err
		}
		a.reserved[key] = true
		return candidate, nil
	}
}

func sameFilePath(a, b string) bool {
	aa, errA := filepath.Abs(a)
	bb, errB := filepath.Abs(b)
	if errA != nil || errB != nil {
		return false
	}
	if runtime.GOOS == "windows" {
		return strings.EqualFold(filepath.Clean(aa), filepath.Clean(bb))
	}
	return filepath.Clean(aa) == filepath.Clean(bb)
}

func applyOutputTimestamp(path, captured string) []string {
	value, err := time.Parse(time.RFC3339Nano, captured)
	if err != nil {
		return []string{"撮影日時を解釈できないため、ファイル日時を設定できませんでした"}
	}
	warnings := []string{}
	if err := os.Chtimes(path, value, value); err != nil {
		warnings = append(warnings, "ファイル更新日時を設定できませんでした: "+err.Error())
	}
	supported, err := setCreationTime(path, value)
	if err != nil {
		warnings = append(warnings, "ファイル作成日時を設定できませんでした: "+err.Error())
	} else if !supported {
		warnings = append(warnings, "このOSではファイル作成日時を設定できません")
	}
	return warnings
}

func writeReport(outputDir string, report runReport) (string, error) {
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return "", err
	}
	name := "takebinder-report-" + time.Now().UTC().Format("20060102-150405.000000000") + ".json"
	path := filepath.Join(outputDir, name)
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", err
	}
	defer file.Close()
	if _, err := file.Write(append(data, '\n')); err != nil {
		return "", err
	}
	return path, nil
}

func writeReportIfEnabled(outputDir string, report runReport, enabled bool) (string, error) {
	if !enabled {
		return "", nil
	}
	return writeReport(outputDir, report)
}

func reusableResults(outputDir string, groups []group) ([]group, []jobResult) {
	reports, _ := filepath.Glob(filepath.Join(outputDir, "takebinder-report-*.json"))
	sort.Sort(sort.Reverse(sort.StringSlice(reports)))
	completed := map[string]reportResult{}
	for _, path := range reports {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var report runReport
		if json.Unmarshal(data, &report) != nil {
			continue
		}
		for _, item := range report.Results {
			if item.Result.Status == "completed" {
				if _, exists := completed[item.Group.ID]; !exists {
					completed[item.Group.ID] = item
				}
			}
		}
	}
	pending := make([]group, 0, len(groups))
	reused := []jobResult{}
	for _, candidate := range groups {
		item, ok := completed[candidate.ID]
		if !ok || !sameInputs(candidate.Files, item.Group.Files) || !safeCompletedOutput(outputDir, item.Result) {
			pending = append(pending, candidate)
			continue
		}
		result := item.Result
		result.Status, result.Message = "skipped", "既存レポートと出力を確認したためスキップしました"
		reused = append(reused, result)
	}
	return pending, reused
}

func sameInputs(current, previous []videoFile) bool {
	if len(current) != len(previous) {
		return false
	}
	for index := range current {
		if !sameFilePath(current[index].Path, previous[index].Path) || current[index].Size != previous[index].Size || current[index].Modified != previous[index].Modified || current[index].Captured != previous[index].Captured || current[index].Chapter != previous[index].Chapter {
			return false
		}
	}
	return true
}

func safeCompletedOutput(outputDir string, result jobResult) bool {
	if result.OutputPath == "" || result.OutputSize <= 0 {
		return false
	}
	root, rootErr := filepath.Abs(outputDir)
	path, pathErr := filepath.Abs(result.OutputPath)
	if rootErr != nil || pathErr != nil {
		return false
	}
	relative, err := filepath.Rel(root, path)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return false
	}
	current := root
	parts := strings.Split(relative, string(filepath.Separator))
	for _, part := range parts[:len(parts)-1] {
		current = filepath.Join(current, part)
		info, err := os.Lstat(current)
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return false
		}
	}
	info, err := os.Lstat(path)
	if err != nil || !info.Mode().IsRegular() || info.Size() != result.OutputSize || (result.OutputModified != "" && info.ModTime().UTC().Format(time.RFC3339Nano) != result.OutputModified) {
		return false
	}
	if result.SHA256 != "" {
		hash, err := hashFile(path, func(int64, int64) {})
		return err == nil && hash == result.SHA256
	}
	return true
}
