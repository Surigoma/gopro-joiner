//go:build linux || darwin

package main

import "syscall"

func availableDiskSpace(path string) (uint64, error) {
	var status syscall.Statfs_t
	if err := syscall.Statfs(path, &status); err != nil {
		return 0, err
	}
	return uint64(status.Bavail) * uint64(status.Bsize), nil
}
