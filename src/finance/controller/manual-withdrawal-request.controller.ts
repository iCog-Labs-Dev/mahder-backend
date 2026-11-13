
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ManualWithdrawalRequestService } from '../service/manual-withdrawal-request.service';
import {
  CreateManualWithdrawalRequestDto,
  RejectManualWithdrawalRequestDto,
} from '../dto/manual-withdrawal-request.dto';

// Adjust this import to match the authentication guard used in your project.
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('manual-withdrawal-requests')
@UseGuards(JwtAuthGuard)
export class ManualWithdrawalRequestController {
  constructor(
    private readonly manualWithdrawalRequestService: ManualWithdrawalRequestService,
  ) {}

  @Post()
  createRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateManualWithdrawalRequestDto,
  ) {
    return this.manualWithdrawalRequestService.createRequest(
      req.user.id,
      dto,
    );
  }

  @Get('my')
  getMyRequests(@Req() req: AuthenticatedRequest) {
    return this.manualWithdrawalRequestService.getMyRequests(req.user.id);
  }

  @Get('manager')
  getManagerRequests(@Req() req: AuthenticatedRequest) {
    return this.manualWithdrawalRequestService.getManagerRequests(
      req.user.id,
    );
  }

  @Post(':id/approve')
  approveRequest(
    @Param('id') requestId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.manualWithdrawalRequestService.approveRequest(
      requestId,
      req.user.id,
    );
  }

  @Post(':id/reject')
  rejectRequest(
    @Param('id') requestId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectManualWithdrawalRequestDto,
  ) {
    return this.manualWithdrawalRequestService.rejectRequest(
      requestId,
      req.user.id,
      dto,
    );
  }
}
