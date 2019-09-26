# Private @aaa-backend-stack/template

> Attention, this file will be overwritten from `.cabgen/README.md.cabgen` when executing `create-aaa-backend``

### How `**/*.cabgen` files work

`**/*.cabgen` files are [lodash _.template() compatible files](https://lodash.com/docs/4.17.10#template) and are automatically compiled with the `interface ICabgenEnvironment` defined in `../create-aaa-backend/src/cabgen.ts`.

Any existing files with the same file signature (without the `.cabgen` extension) are automatically overwritten.

### How `**/.cabgen` dirs work

All files inside `.cabgen` directories in any deep are recursively expanded into their parent folder. Attention, **no sub-directories** are allowed inside these folders! Use this folder to organize files which are **never** relevant for executing the template inside the monorepo directly.
