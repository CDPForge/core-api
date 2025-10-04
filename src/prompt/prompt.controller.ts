import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";
import { PermissionLevel, Permissions, ResourceType } from "../decorators/permissions.decorator";
import { User } from "../users/user.model";

interface PromptRequest {
  message: string;
  clientId: number;
}

@Controller("prompt")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @Permissions({
      resourceType: ResourceType.CLIENT,
      clientIdParam: "clientId",
      permissions: [{permission:"prompt", level: PermissionLevel.EXECUTE}],
  })
  async create(
    @Req() req: any,
    @Body() promptData: PromptRequest,
  ): Promise<string> {
    const user = req.user!.user as User;
    const { message, clientId } = promptData;

    if (!clientId) {
      throw new BadRequestException("Client ID is required");
    }

    // Verifica che l'utente abbia accesso al client specificato
    const userPermissions = req.user!.permissions || [];
    const hasAccessToClient = userPermissions.some(
      (perm: any) => perm.client === clientId,
    );

    if (!hasAccessToClient) {
      throw new BadRequestException("Access denied to the specified client");
    }

    return this.promptService.send(user, message, clientId);
  }

  @Post("clear-history")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "clientId",
    permissions: [{permission:"prompt", level: PermissionLevel.EXECUTE}],
  })
  async clearHistory(
    @Req() req: any,
    @Body() body: { clientId: number },
  ): Promise<{ success: boolean }> {
    const user = req.user!.user as User;
    const { clientId } = body;

    if (!clientId) {
      throw new BadRequestException("Client ID is required");
    }

    // Verifica che l'utente abbia accesso al client specificato
    const userPermissions = req.user!.permissions || [];
    const hasAccessToClient = userPermissions.some(
      (perm: any) => perm.client === clientId,
    );

    if (!hasAccessToClient) {
      throw new BadRequestException("Access denied to the specified client");
    }

    await this.promptService.clearHistory(user, clientId);
    return { success: true };
  }
}
