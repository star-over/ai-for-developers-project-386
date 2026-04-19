export const t = {
  nav: {
    home: 'Главная',
    booking: 'Запись',
    adminBookings: 'Встречи',
    adminEventTypes: 'Типы событий',
    brand: 'Calendar',
  },
  home: {
    title: 'Запись на звонок',
    subtitle: 'Выберите удобное время для встречи',
    cta: 'Записаться',
  },
  eventTypes: {
    title: 'Выберите тип встречи',
    empty: 'Нет доступных событий',
    minutes: 'мин',
  },
  booking: {
    selectDate: 'Выберите дату',
    selectSlot: 'Выберите время',
    slotFree: 'Свободно',
    slotTaken: 'Занято',
    continue: 'Продолжить',
    formTitle: 'Ваши данные',
    form: {
      name: 'Ваше имя',
      email: 'Email',
      submit: 'Записаться',
      cancel: 'Отмена',
      namePlaceholder: 'Введите имя',
      emailPlaceholder: 'mail@example.com',
    },
    success: 'Бронирование создано!',
    conflict: 'Слот уже занят, выберите другое время',
  },
  admin: {
    bookings: {
      title: 'Предстоящие встречи',
      empty: 'Нет предстоящих встреч',
    },
    eventTypes: {
      title: 'Типы событий',
      create: 'Создать',
      edit: 'Редактировать',
      delete: 'Удалить',
      confirmDelete: 'Удалить тип события?',
      form: {
        name: 'Название',
        duration: 'Длительность',
        namePlaceholder: 'Название события',
        save: 'Сохранить',
        cancel: 'Отмена',
      },
    },
  },
  myBookings: {
    title: 'Мои записи',
    empty: 'У вас нет записей',
    confirmTitle: 'Удалить запись?',
    confirmAction: 'Удалить',
  },
  common: {
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    retry: 'Повторить',
  },
} as const;
