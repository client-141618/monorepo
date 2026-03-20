import { request } from "../request"

export interface TeamListQuery {
  activityDate?: string
  venueId?: number
  status?: number
  pageNum?: number
  pageSize?: number
}

export interface TeamRecruitmentListItem {
  id: number
  reservationId: number
  venueTypeId?: number
  venueTypeName?: string
  venueId?: number
  venueName?: string
  courtId?: number
  title?: string
  description?: string
  deadlineTime?: string
  requiredCount?: number
  currentCount?: number
  remainingCount?: number
  activityDate?: string
  initiatorWxUserId?: number
  initiatorName?: string
  contactType?: number
  contactMasked?: string
  contactValue?: string | null
  status?: number
  createTime?: string
  joined?: boolean
}

export interface TeamRecruitmentPageResponse {
  total?: number
  pageNum?: number
  pageSize?: number
  records?: TeamRecruitmentListItem[]
}

export interface TeamRecruitmentMember {
  wxUserId?: number
  username?: string
  avatar?: string
  role?: number
}

export interface TeamRecruitmentDetailResponse {
  team?: TeamRecruitmentListItem
  members?: TeamRecruitmentMember[]
}

export interface TeamRecruitmentCreatePayload {
  reservationId: number
  title: string
  description?: string
  deadlineTime: string
  requiredCount: number
  contactType: number
  contactValue: string
}

export function getTeamListApi(params: TeamListQuery) {
  return request<TeamRecruitmentPageResponse>({
    url: "/api/team/list",
    method: "GET",
    data: params,
  })
}

export function getTeamDetailApi(teamId: number) {
  return request<TeamRecruitmentDetailResponse>({
    url: `/api/team/${teamId}`,
    method: "GET",
  })
}

export function joinTeamApi(teamId: number) {
  return request<null>({
    url: `/api/team/join/${teamId}`,
    method: "POST",
  })
}

export function createTeamApi(data: TeamRecruitmentCreatePayload) {
  return request<number>({
    url: "/api/team/create",
    method: "POST",
    data,
  })
}
