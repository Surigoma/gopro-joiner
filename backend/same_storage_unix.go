//go:build !windows

package main

import (
	"os"
	"syscall"
)

func sameStorage(first, second string) bool {
	firstInfo, firstErr := os.Stat(first)
	secondInfo, secondErr := os.Stat(second)
	if firstErr != nil || secondErr != nil {
		return false
	}
	firstStat, firstOK := firstInfo.Sys().(*syscall.Stat_t)
	secondStat, secondOK := secondInfo.Sys().(*syscall.Stat_t)
	return firstOK && secondOK && firstStat.Dev == secondStat.Dev
}
