import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { MailModule } from "../mail/mail.module";
import { RemindersService } from "./reminders.service";

@Module({
  imports: [PrismaModule, MailModule],
  providers: [RemindersService],
})
export class RemindersModule {}