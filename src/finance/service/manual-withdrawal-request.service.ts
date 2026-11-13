
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  ManualWithdrawalRequest,
  ManualWithdrawalStatus,
} from '../entities/manual-withdrawal-request.entity';
import { Project } from '../../project/entities/Project.entity';
import { Wallet } from '../entities/Wallet.entity';
import { Transaction } from '../entities/Transaction.entity';
import { WalletService } from './Wallet.service';
import {
  CreateManualWithdrawalRequestDto,
  RejectManualWithdrawalRequestDto,
} from '../dto/manual-withdrawal-request.dto';
import { UserTask } from '../../project/entities/UserTask.entity';


@Injectable()
export class ManualWithdrawalRequestService {
  constructor(
    @InjectRepository(ManualWithdrawalRequest)
    private readonly requestRepository: Repository<ManualWithdrawalRequest>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async createRequest(
    userId: string,
    dto: CreateManualWithdrawalRequestDto,
    
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.project_id },
    });

    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.dataSource.transaction(async (manager) => {
      // Verify that the user has an active Contributor or Reviewer
    // assignment in the requested project.
    const activeAssignment = await manager
      .getRepository(UserTask)
      .createQueryBuilder('userTask')
      .innerJoin('userTask.task', 'task')
      .where('userTask.user_id = :userId', { userId })
      .andWhere('task.project_id = :projectId', {
        projectId: project.id,
      })
      .andWhere('userTask.role IN (:...roles)', {
        roles: ['Contributor', 'Reviewer'],
      })
      .andWhere('userTask.status = :status', {
        status: 'Active',
      })
      .getOne();

    if (!activeAssignment) {
      throw new ForbiddenException(
        'You must have an active Contributor or Reviewer assignment in this project to request a withdrawal',
      );
    }

    // Reserve wallet funds only after authorization succeeds.



      const transaction = await this.walletService.reserveWithdrawal(
        userId,
        dto.amount,
        dto.phone_number,
        dto.payment_method,
        manager.queryRunner!,
      );

      const request = manager.create(ManualWithdrawalRequest, {
        user_id: userId,
        project_id: project.id,
        transaction_id: transaction.id,
        phone_number: dto.phone_number,
        payment_method: dto.payment_method,
        status: ManualWithdrawalStatus.PENDING,
      });

      return manager.save(request);
    });
  }

  async getMyRequests(userId: string) {
    return this.requestRepository.find({
      where: { user_id: userId },
      relations: { project: true, transaction: true },
      order: { created_at: 'DESC' },
    });
  }

  async getManagerRequests(managerId: string) {
    return this.requestRepository
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.project', 'project')
      .innerJoinAndSelect('request.user', 'user')
      .innerJoinAndSelect('request.transaction', 'transaction')
      .where('project.manager_id = :managerId', { managerId })
      .orderBy('request.created_at', 'DESC')
      .getMany();
  }

  async approveRequest(requestId: string, managerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ManualWithdrawalRequest, {
        where: { id: requestId },
        relations: { project: true, transaction: true },
        lock: { mode: 'pessimistic_write' },
      });
      //const checkRequest: ManualWithdrawalRequest = request;

      if (!request) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (request.project.manager_id !== managerId) {
        throw new ForbiddenException(
          'You can only approve requests for your own projects',
        );
      }

      if (request.status !== ManualWithdrawalStatus.PENDING) {
        throw new BadRequestException('This request has already been processed');
      }

      if (request.transaction.status !== 'Reserved') {
        throw new BadRequestException(
          'The reserved withdrawal transaction is not in the expected state',
        );
      }

      request.status = ManualWithdrawalStatus.APPROVED;
      request.reviewed_by = managerId;
      request.reviewed_at = new Date();

      request.transaction.status = 'Settled';

      await manager.save(Transaction, request.transaction);
      return manager.save(ManualWithdrawalRequest, request);
    });
  }

  async rejectRequest(
    requestId: string,
    managerId: string,
    dto: RejectManualWithdrawalRequestDto,
  ) {
    const reason = dto.rejection_reason?.trim();

    if (!reason) {
      throw new BadRequestException('A rejection reason is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ManualWithdrawalRequest, {
        where: { id: requestId },
        relations: { project: true, transaction: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (request.project.manager_id !== managerId) {
        throw new ForbiddenException(
          'You can only reject requests for your own projects',
        );
      }

      if (request.status !== ManualWithdrawalStatus.PENDING) {
        throw new BadRequestException('This request has already been processed');
      }

      if (request.transaction.status !== 'Reserved') {
        throw new BadRequestException(
          'The reserved withdrawal transaction is not in the expected state',
        );
      }

      const wallet = await manager.findOne(Wallet, {
        where: { user_id: request.user_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('User wallet not found');
      }

      wallet.balance =
        Number(wallet.balance) + Math.abs(Number(request.transaction.amount));

      request.transaction.status = 'Reversed';
      request.status = ManualWithdrawalStatus.REJECTED;
      request.rejection_reason = reason;
      request.reviewed_by = managerId;
      request.reviewed_at = new Date();

      await manager.save(Wallet, wallet);
      await manager.save(Transaction, request.transaction);

      return manager.save(ManualWithdrawalRequest, request);
    });
  }
}
