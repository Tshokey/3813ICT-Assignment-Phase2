export type Role = "USER" | "GROUP_ADMIN" | "SUPER_ADMIN"

export class User {
  id: number
  username: string
  password: string
  email: string
  roles: Role[]
  groups: string[]
  profileImage?: string | null

  toPromoteGroup?: boolean = false
  toPromoteSuper?: boolean = false

  constructor(
    id = 0,
    username = "",
    email = "",
    password = "",
    roles: Role[] = [],
    groups: string[] = [],
    profileImage: string | null = null,
  ) {
    this.id = id
    this.username = username
    this.password = password
    this.email = email
    this.roles = roles
    this.groups = groups
    this.profileImage = profileImage
  }
}
