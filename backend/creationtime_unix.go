//go:build linux || darwin

package main

import "time"

func setCreationTime(_ string, _ time.Time) (bool, error) {
	return false, nil
}
