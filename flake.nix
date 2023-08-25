{
  inputs = {
    purs-nix.url = "github:purs-nix/purs-nix";
    nixpkgs.follows = "purs-nix/nixpkgs";
    utils.url = "github:ursi/flake-utils";
    ps-tools.follows = "purs-nix/ps-tools";
    systems.url = "github:nix-systems/default";
    spago2nix.url = "github:justinwoo/spago2nix";

    npmlock2nix = {
      flake = false;
      url = "github:nix-community/npmlock2nix";
    };
  };

  outputs = {
    self,
    utils,
    nixpkgs,
    flake-utils,
    systems,
    ...
  } @ inputs: let
    systems = ["x86_64-linux"];
    pkgs = nixpkgs.legacyPackages.x86_64-linux;
    npmlock2nix = (import inputs.npmlock2nix {inherit pkgs;}).v1;
  in
    utils.apply-systems
    {inherit inputs systems;}
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
          dir = ./src/purescript;
          # Dependencies
          dependencies = with purs-nix.ps-pkgs; [
            react
            react-dom
            aff
            aff-promise
            argonaut
            argonaut-generic
            arrays
            bifunctors
            console
            control
            effect
            either
            exceptions
            foldable-traversable
            free
            functions
            maybe
            ordered-collections
            pairs
            prelude
            react-basic
            react-basic-dom
            react-basic-hooks
            strings
            test-unit
            tuples
            validation
            web-dom
            web-html
          ];
          # FFI dependencies
          # foreign.Foreign.JSON.node_modules = node_modules/package-lock.json;
        };
      ps-tools = inputs.ps-tools.legacyPackages.${system};
      ps-command = ps.command {};
      pkgs = import nixpkgs {
        inherit system;
      };
      spago2nix = inputs.spago2nix.packages.${system}.spago2nix;
      weekStatsScript = pkgs.writeScriptBin "weekStats" (builtins.readFile ./scripts/getCurrentWkStats.sh);
      seasonStatsScript = pkgs.writeScriptBin "dayStats" (builtins.readFile ./scripts/wholeDAY.sh);
      rosterScript = pkgs.writeScriptBin "roster" (builtins.readFile ./scripts/scrape_active_players.sh);
    in rec {
      defaultApp = flake-utils.lib.mkApp {
        type = "app";
        drv = live-server;
      };
      live-server = pkgs.nodePackages.live-server;
      typescript = pkgs.nodePackages.typescript;
      # packages.default = ps.output {};
      packages = with ps; {
        # default = app {name = "fantasyDraft";};
        bundle = bundle {};
        output = output {};
      };

      devShells.default =
        pkgs.mkShell
        {
          packages = with pkgs; [
            ps-command
            ps-tools.for-0_15.purescript-language-server
            purs-nix.esbuild
            purs-nix.purescript
            nodejs
            spago
            yarn2nix

            purescript
            nodejs
            # nodePackages.purs-tidy
            # esbuild

            # Bash Scripts to Pull in Data
            weekStatsScript
            seasonStatsScript
            rosterScript

            inputs.spago2nix.packages.x86_64-linux.spago2nix
          ];
          buildInputs = with pkgs; [
            nodejs
            spago

            purescript
            # esbuild

            # You can choose pnpm, yarn, or none (npm).
            nodePackages.pnpm
            nodePackages.live-server
            nodePackages.typescript
            nodePackages.typescript-language-server
          ];

          shellHook = ''
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

        typescript = {
          type = "app";
          program = "${typescript}/bin/typescript";
        };

        spago2nix = {
          type = "app";
          program = "${spago2nix}/bin/spago2nix";
        };
        # purStats = {
        #   type = "app";
        #   program = "${purStats}/bin/purStats";
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
