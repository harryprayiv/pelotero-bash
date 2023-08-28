{-
Welcome to a Spago project!
You can edit this file as you like.

Need help? See the following resources:
- Spago documentation: https://github.com/purescript/spago
- Dhall language tour: https://docs.dhall-lang.org/tutorials/Language-Tour.html

When creating a new Spago project, you can use
`spago init --no-comments` or `spago init -C`deep            
to generate this file without the comments in this block.
-}
{ name = "my-project"
, dependencies = [ "prelude" , "console" , "datetime" , "arrays" , "effect" , "either" , "node-fs" , "node-buffer" , "exceptions" , "partial" , "prelude" , "psci-support" , "quickcheck" , "aff" ]
, packages = ./packages.dhall
, sources = [ "src/purescript/**/*.purs", "src/purescript/test/**/*.purs" ]
}
