export interface IncomingMessage {
  phone: string
  text: string
  messageId: string
  /**
   * Populated when the incoming message is an interactive reply (button or
   * list selection). Contains the `id` field set when the message was sent.
   */
  interactiveReplyId?: string
}
