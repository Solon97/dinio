import { beforeEach, describe, expect, it, vi } from "vitest";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { Notification } from "../../domain/entities/Notification";
import { ScheduleNotificationUseCase } from "./ScheduleNotificationUseCase";

const makeNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: "notif-1",
  userId: "user-123",
  type: "general",
  title: "Test Title",
  message: "Test message",
  deliveryChannels: ["in_app"],
  status: "pending",
  emailSent: false,
  emailAttempts: 0,
  read: false,
  referenceId: null,
  dedupeKey: null,
  notificationDate: null,
  nextRetryAt: null,
  lastError: null,
  sentAt: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("ScheduleNotificationUseCase", () => {
  let useCase: ScheduleNotificationUseCase;
  let mockRepo: INotificationRepository;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      createIfNotExists: vi.fn(),
      findById: vi.fn(),
      findByUser: vi.fn(),
      claimPendingEmailBatch: vi.fn(),
      markAsRead: vi.fn(),
      markEmailSent: vi.fn(),
      markEmailFailed: vi.fn(),
      countUnread: vi.fn(),
    };
    useCase = new ScheduleNotificationUseCase(mockRepo);
  });

  it("should create a notification successfully", async () => {
    const expected = makeNotification();
    vi.mocked(mockRepo.create).mockResolvedValue(expected);

    const result = await useCase.execute({
      userId: "user-123",
      type: "general",
      title: "Test Title",
      message: "Test message",
      deliveryChannels: ["in_app"],
    });

    expect(result).toEqual(expected);
    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: "user-123",
      type: "general",
      title: "Test Title",
      message: "Test message",
      deliveryChannels: ["in_app"],
    });
  });

  it("should throw when userId is missing", async () => {
    await expect(
      useCase.execute({
        userId: "",
        type: "general",
        title: "Test",
        message: "Test",
        deliveryChannels: ["in_app"],
      }),
    ).rejects.toThrow("userId is required");
  });

  it("should throw when title is empty", async () => {
    await expect(
      useCase.execute({
        userId: "user-123",
        type: "general",
        title: "  ",
        message: "Test",
        deliveryChannels: ["in_app"],
      }),
    ).rejects.toThrow("title is required");
  });

  it("should throw when message is empty", async () => {
    await expect(
      useCase.execute({
        userId: "user-123",
        type: "general",
        title: "Test",
        message: "",
        deliveryChannels: ["in_app"],
      }),
    ).rejects.toThrow("message is required");
  });

  it("should throw when deliveryChannels is empty", async () => {
    await expect(
      useCase.execute({
        userId: "user-123",
        type: "general",
        title: "Test",
        message: "Test",
        deliveryChannels: [],
      }),
    ).rejects.toThrow("at least one delivery channel is required");
  });

  it("should support dedupe fields for daily generation", async () => {
    const expected = makeNotification({
      dedupeKey: "user-123:budget_alert:2026-03-02",
      notificationDate: "2026-03-02",
    });
    vi.mocked(mockRepo.create).mockResolvedValue(expected);

    const result = await useCase.execute({
      userId: "user-123",
      type: "budget_alert",
      title: "Daily budget",
      message: "Check today's budget",
      deliveryChannels: ["in_app", "email"],
      dedupeKey: "user-123:budget_alert:2026-03-02",
      notificationDate: "2026-03-02",
    });

    expect(result.dedupeKey).toEqual("user-123:budget_alert:2026-03-02");
  });
});
