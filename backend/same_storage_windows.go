//go:build windows

package main

import (
	"path/filepath"
	"strings"
)

func sameStorage(first, second string) bool {
	firstVolume, secondVolume := filepath.VolumeName(first), filepath.VolumeName(second)
	return firstVolume != "" && strings.EqualFold(firstVolume, secondVolume)
}
