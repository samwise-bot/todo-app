package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"
	"path/filepath"
)

func main() {
	var (
		inFile  = flag.String("in", filepath.Clean("../docs/openapi/openapi-source.json"), "path to OpenAPI JSON source")
		outFile = flag.String("out", filepath.Clean("../docs/openapi/openapi.json"), "path to generated OpenAPI JSON")
	)
	flag.Parse()

	sourceJSON, err := os.ReadFile(*inFile)
	if err != nil {
		log.Fatalf("read source: %v", err)
	}

	var spec any
	if err := json.Unmarshal(sourceJSON, &spec); err != nil {
		log.Fatalf("parse source json: %v", err)
	}

	jsonBytes, err := json.MarshalIndent(spec, "", "  ")
	if err != nil {
		log.Fatalf("marshal json: %v", err)
	}
	jsonBytes = append(jsonBytes, '\n')

	if err := os.WriteFile(*outFile, jsonBytes, 0o644); err != nil {
		log.Fatalf("write output: %v", err)
	}
}
