import type { TeamCancelPayload, TeamPageQuery, TeamRecord } from "./type"
import type { PageRequest, PageResult } from "@/api/base/types"
import { request } from "@/utils/request"

const PREFIX = "/api/team"

export function getTeamPageApi(data: PageRequest<TeamPageQuery>) {
  return request<PageResult<TeamRecord>>({
    url: `${PREFIX}/page`,
    method: "POST",
    data,
  })
}

export function cancelTeamApi(teamId: number, data?: TeamCancelPayload) {
  return request<null>({
    url: `${PREFIX}/cancel/${teamId}`,
    method: "PUT",
    data,
  })
}
