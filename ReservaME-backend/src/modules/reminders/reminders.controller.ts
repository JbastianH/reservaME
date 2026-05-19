import { Controller, Post, Req, UnauthorizedException } from "@nestjs/common";
import { RemindersService } from "./reminders.service";

@Controller('internal/reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post('run')
  async run(@Req() req: Request) {
    const secret = req.headers['x-cron-secret'];

    if (secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException();
    }

    await this.reminders.run();
    return { ok: true };
  }
}