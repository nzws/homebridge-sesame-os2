declare module 'node-aes-cmac' {
  const aesCmac: (
    key: string | Buffer,
    message: string | Buffer,
    options?: {
      returnAsBuffer?: boolean;
    }
  ) => string | Buffer;
}
