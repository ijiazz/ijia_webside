// pnpm dlx jsr add @asla/yoursql 安装的包经过 jsr编译，存在问题，Symbol 属性会丢失，这里补上

declare module "@asla/yoursql/client" {
  export interface DbCursor<T> extends AsyncDisposable, AsyncIterable<any> {}
}
