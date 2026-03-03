{
  description = "todo-app dev environment (Go + Next.js + SQLite)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            go
            nodejs_22
            sqlite
            gnumake
            git
            gh
          ];

          shellHook = ''
            export GOPATH="$PWD/.gopath"
            export GOCACHE="$PWD/.cache/go-build"
            export PATH="$GOPATH/bin:$PATH"
            echo "✅ todo-app dev shell ready"
            echo "   - Go: $(go version 2>/dev/null || true)"
            echo "   - Node: $(node --version 2>/dev/null || true)"
            echo "   - npm: $(npm --version 2>/dev/null || true)"
          '';
        };
      });
}
