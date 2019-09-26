# @aaa-backend-stack/logger

### Exposes the following binaries (see `bin` in `package.json`) for use in your service project.
- bunyan

`process.env.NODE_ENV === test`
Will always disable configured slack error logging

`process.env.NODE_ENV === development`
Nodemon relevant: will always show closing of file-descriptors
