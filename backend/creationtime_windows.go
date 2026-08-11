//go:build windows

package main

import (
	"syscall"
	"time"
)

func setCreationTime(path string, value time.Time) (bool, error) {
	pointer, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return true, err
	}
	handle, err := syscall.CreateFile(pointer, syscall.FILE_WRITE_ATTRIBUTES, syscall.FILE_SHARE_READ|syscall.FILE_SHARE_WRITE|syscall.FILE_SHARE_DELETE, nil, syscall.OPEN_EXISTING, syscall.FILE_ATTRIBUTE_NORMAL, 0)
	if err != nil {
		return true, err
	}
	defer syscall.CloseHandle(handle)
	fileTime := syscall.NsecToFiletime(value.UnixNano())
	return true, syscall.SetFileTime(handle, &fileTime, nil, nil)
}
