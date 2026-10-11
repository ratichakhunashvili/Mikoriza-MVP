import type { AlertSpec } from '../../lib/mockAutomation/helpers';

/** სატესტო შეტყობინებების ნაკადი ოპერატორის პანელის დიზაინის დემონსტრაციისთვის */
export const DEMO_NOTIFICATIONS: Omit<AlertSpec, 'key'>[] = [
  {
    kind: 'warning',
    title: 'ტენიანობა დაბალია სექცია B-ში.',
    action: 'შეამოწმეთ წყლის მიწოდება ან ჩართეთ დამატენიანებელი.',
    sectionId: 'B',
    guideId: 'humidity-low',
  },
  {
    kind: 'info',
    title: 'სექცია A მზად არის შემდეგი შემოწმებისთვის.',
    action: 'შეამოწმეთ სუნი და ჭიების აქტიურობა, შემდეგ მონიშნეთ შემოწმება დასრულებულად.',
    sectionId: 'A',
    guideId: 'visual-check',
  },
  {
    kind: 'sensor_offline',
    title: 'ტენიანობის სენსორი აღარ აგზავნის მონაცემებს (სექცია C).',
    action: 'შეამოწმეთ სენსორის კაბელი და კვება.',
    sectionId: 'C',
    guideId: 'sensor-offline',
  },
  {
    kind: 'critical',
    title: 'ტემპერატურა აჭარბებს უსაფრთხო ზღვარს სექცია A-ში.',
    action: 'საჭიროა ფიზიკური შემოწმება. შეაჩერეთ შემრევი და გაზარდეთ ჰაერის ცვლა.',
    sectionId: 'A',
    guideId: 'temperature-high',
  },
  {
    kind: 'warning',
    title: 'pH-ის მნიშვნელობა საჭიროებს შემოწმებას სექცია B-ში.',
    action: 'ხელით გაზომეთ pH და შეადარეთ სენსორის მაჩვენებელს.',
    sectionId: 'B',
    guideId: 'ph-range',
  },
  {
    kind: 'device_error',
    title: 'შემრევი ვერ ჩაირთო. საჭიროა ტექნიკური შემოწმება.',
    action: 'არ სცადოთ განმეორებით ჩართვა. შეამოწმეთ მოწყობილობა და შექმენით ტექნიკური დავალება.',
    guideId: 'device-error',
  },
  {
    kind: 'maintenance',
    title: 'დამატენიანებლის საქშენის გასუფთავების დრო დადგა.',
    action: 'დაგეგმეთ გასუფთავება ტექნიკური მომსახურების გვერდზე.',
    guideId: 'calibration',
  },
  {
    kind: 'info',
    title: 'სექცია C მზად არის ბიოჰუმუსის ამოსაღებად.',
    action: 'შეამოწმეთ მასალა და, თუ ის მუქი და მიწისებრია, ამოიღეთ ბიოჰუმუსი.',
    sectionId: 'C',
    guideId: 'visual-check',
  },
];
