package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	a := &app{out: json.NewEncoder(os.Stdout)}
	if err := a.serve(os.Stdin); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
