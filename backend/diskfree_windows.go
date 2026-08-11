//go:build windows

package main

import (
	"fmt"
	"syscall"
	"unsafe"
)

func availableDiskSpace(path string) (uint64, error) {
	pointer, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return 0, err
	}
	var available uint64
	procedure := syscall.NewLazyDLL("kernel32.dll").NewProc("GetDiskFreeSpaceExW")
	result, _, callErr := procedure.Call(uintptr(unsafe.Pointer(pointer)), uintptr(unsafe.Pointer(&available)), 0, 0)
	if result == 0 {
		return 0, fmt.Errorf("get free disk space: %w", callErr)
	}
	return available, nil
}
