export interface RegisterParams {
  username: string
  phone: string
  password: string
}

export interface PageRequest<TQuery = undefined> {
  pageNum: number
  pageSize: number
  queryDTO?: TQuery
}

export interface PageResult<TRecord> {
  records?: TRecord[]
  total?: number
  size?: number
  current?: number
}
