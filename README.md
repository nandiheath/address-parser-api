# address-parser-api

This is a simple project create endpoint for using the [hk-address-parser-lib](https://github.com/g0vhk-io/hk-address-parser-lib)

## Run

```bash
# install dependencies
yarn

# run
yarn start
```

will listen to port `3000` by default

### EndPoints

http://localhost:3000/search?address=[ADDRESS]&lang=[LANG]

- `ADDRESS`: url encoded adress string
- `LANG`: the output language. support `en_us` and `zh_hk`.
