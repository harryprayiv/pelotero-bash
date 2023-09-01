{
  inputs = {
    #Generic Stuff
    nixpkgs.follows = "purs-nix/nixpkgs";
    systems.url = "github:nix-systems/default";
    utils.url = "github:ursi/flake-utils";

    # Purescript stuff
    purs-nix.url = "github:purs-nix/purs-nix/ps-0.15";
    ps-tools.follows = "purs-nix/ps-tools";

    # Haskell stuff
    # haskell-nix.url = "github:input-output-hk/haskell.nix";

    # *2Nix

    npmlock2nix = {
      flake = false;
      url = "github:nix-community/npmlock2nix";
    };
  };

  outputs = {
    self,
    utils,
    nixpkgs,
    systems,
    ...
  } @ inputs: let
    name = "pelotero";
    systems = [
      "aarch64-darwin"
      "x86_64-darwin"
      "x86_64-linux"
    ];
    pkgs = nixpkgs.legacyPackages.x86_64-linux;
    npmlock2nix = (import inputs.npmlock2nix {inherit pkgs;}).v1;
  in
    utils.apply-systems
    {
      inherit inputs systems;

      # overlays = [inputs.haskell-nix.overlay];
    }
    ({
      system,
      pkgs,
      ...
    }: let
      purs-nix = inputs.purs-nix {inherit system;};
      ps =
        purs-nix.purs
        {
          # Project dir (src, test)
          srcs = [
            "src/purescript/Wallet/**/*.purs"
            "src/purescript/Drafting/**/*.purs"
            "src/purescript/Server/**/*.purs"
            "src/purescript/Console/**/*.purs"
          ];
          test = "src/purescript/test/**/*.purs";

          test-module = "Test.Main";
          # Dependencies
          dependencies = with purs-nix.ps-pkgs; [
            prelude
            datetime
            console
            ordered-collections
            arrays
            effect
            either
            foreign
            exceptions
            partial
            psci-support
            quickcheck
            aff
            affjax
            fetch

            #Server
            routing-duplex
            httpure
            yoga-json
          ];

          foreign.Main.node_modules = npmlock2nix.node_modules {src = ./.;} + /node_modules;
        };

      ps-tools = inputs.ps-tools.legacyPackages.${system};
      ps-command = ps.command {};
      pkgs = import nixpkgs {
        inherit system;
      };

      # hixProject = pkgs.haskell-nix.hix.project {
      #   src = ./.;
      #   evalSystem = "x86_64-linux";
      # };
      # flake = hixProject.flake { };

      weekStatsScript = pkgs.writeScriptBin "weekStats" (builtins.readFile ./scripts/getCurrentWkStats.sh);
      seasonStatsScript = pkgs.writeScriptBin "dayStats" (builtins.readFile ./scripts/wholeDAY.sh);
      compositeStatsScript = pkgs.writeScriptBin "compositeDays" (builtins.readFile ./scripts/compositeStats.sh);

      rosterScript = pkgs.writeScriptBin "roster" (builtins.readFile ./scripts/scrape_active_players.sh);

      statPull = pkgs.writeShellScriptBin "statPull" ''
        if [ "$#" -ne 2 ]; then
            echo "Usage: $0 <start_date> <end_date>"
            exit 1
        fi

        start_date="$1"
        end_date="$2"

        dayStats "$start_date" "$end_date"
        compositeDays "$start_date" "$end_date"
      '';

      purs-watch = pkgs.writeShellApplication {
        name = "purs-watch";
        runtimeInputs = with pkgs; [entr ps-command];
        text = "find src/purescript | entr -s 'echo building && purs-nix compile'";
      };

      purs-test = pkgs.writeShellApplication {
        name = "purs-watch";
        runtimeInputs = with pkgs; [entr ps-command];
        text = "find src/purescript/test | entr -s 'echo running tests && purs-nix test'";
      };

      vite = pkgs.writeShellApplication {
        name = "vite";
        runtimeInputs = with pkgs; [nodejs];
        text = "npx vite --open";
      };

      purs-dev = pkgs.writeShellApplication {
        name = "purs-dev";
        runtimeInputs = with pkgs; [concurrently];
        text = "concurrently purs-watch vite";
      };
    in rec {
      defaultApp = utils.lib.mkApp {
        type = "app";
        drv = live-server;
      };

      live-server = pkgs.nodePackages.live-server;
      # packages.default = ps.output {};

      packages = with ps; {
        default = ps.modules.Main.bundle {};
        bundle = bundle {};
        output = output {};
      };
      # bundle.esbuild = {format = "iife";};
      devShells.default =
        pkgs.mkShell
        {
          inherit name;
          packages = with pkgs; [
            ps-command
            ps-tools.for-0_15.purescript-language-server
            ps-tools.for-0_15.purs-tidy
            purs-nix.esbuild
            purs-nix.purescript
            nodejs

            yarn2nix

            vite
            purs-watch
            purs-dev

            # Bash Scripts to Pull in Data
            weekStatsScript
            seasonStatsScript
            compositeStatsScript
            rosterScript
            statPull
          ];
          buildInputs = with pkgs; [
            nodejs

            purs-nix.esbuild
            purs-nix.purescript

            # You can choose pnpm, yarn, or none (npm).
            nodePackages.pnpm
            nodePackages.live-server
            # nodePackages.typescript
            # nodePackages.typescript-language-server
          ];
          shellHook = ''
            export NIX_SHELL_NAME="pelotero"
            echo "Welcome to the development shell!"
            echo
            echo grabbing the Current Complete MLB roster right quick....
            ./scripts/scrape_active_players.sh
            echo .
            echo ..
            echo ...
          '';
        };
      apps = {
        live-server = {
          type = "app";
          program = "${live-server}/bin/live-server";
        };

        # typescript = {
        #   type = "app";
        #   program = "${typescript}/bin/typescript";
        # };
      };
    });

  # --- Flake Local Nix Configuration ----------------------------
  nixConfig = {
    # This sets the flake to use nix cache.
    # Nix should ask for permission before using it,
    # but remove it here if you do not want it to.
    extra-substituters = [
      "https://klarkc.cachix.org?priority=99"
      "https://cache.iog.io"
      "https://cache.zw3rk.com"
      "https://cache.nixos.org"
      "https://hercules-ci.cachix.org"
    ];
    extra-trusted-public-keys = [
      "klarkc.cachix.org-1:R+z+m4Cq0hMgfZ7AQ42WRpGuHJumLLx3k0XhwpNFq9U="
      "hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ="
      "loony-tools:pr9m4BkM/5/eSTZlkQyRt57Jz7OMBxNSUiMC4FkcNfk="
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      "hercules-ci.cachix.org-1:ZZeDl9Va+xe9j+KqdzoBZMFJHVQ42Uu/c/1/KMC5Lw0="
    ];
  };
}
