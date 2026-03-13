import { Notification } from "../../domain/entities/Notification";
import {
  CreateNotificationInput,
  INotificationRepository,
} from "../../domain/repositories/INotificationRepository";

export type ScheduleNotificationInput = CreateNotificationInput;

export class ScheduleNotificationUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(input: ScheduleNotificationInput): Promise<Notification> {
    if (!input.userId) {
      throw new Error("userId is required");
    }
    if (!input.title?.trim()) {
      throw new Error("title is required");
    }
    if (!input.message?.trim()) {
      throw new Error("message is required");
    }
    if (!input.deliveryChannels || input.deliveryChannels.length === 0) {
      throw new Error("at least one delivery channel is required");
    }

    return this.notificationRepository.create(input);
  }
}
