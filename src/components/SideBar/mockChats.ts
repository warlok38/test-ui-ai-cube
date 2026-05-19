export type MockChat = {
  id: string
  title: string
}

export type MockChatGroup = {
  label: string
  chats: MockChat[]
}

export const MOCK_CHAT_GROUPS: MockChatGroup[] = [
  {
    label: 'Сегодня',
    chats: [
      { id: '1', title: 'Аналитика продаж Q1' },
      { id: '2', title: 'Сравнение регионов' }
    ]
  },
  {
    label: '2026-04',
    chats: [
      { id: '3', title: 'Динамика выручки' },
      { id: '4', title: 'Топ SKU по марже' }
    ]
  }
]
