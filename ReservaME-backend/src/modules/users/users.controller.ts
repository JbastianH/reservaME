import { Body, Controller, Post } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { UsersService } from "./users.service";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";

@Auth("ADMIN")
@Controller("admin/users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  crear(@Body() dto: AdminCreateUserDto) {
    return this.service.crear(dto);
  }
}