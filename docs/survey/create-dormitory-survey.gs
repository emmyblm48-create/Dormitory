/**
 * สร้าง Google Form แบบสอบถามความพึงพอใจต่อแอป Dormitory
 *
 * วิธีใช้ (ทำบนคอมพิวเตอร์):
 * 1. เปิด https://script.google.com แล้วกด "โครงการใหม่"
 * 2. ลบโค้ดเดิมทั้งหมด วางโค้ดไฟล์นี้ลงไป แล้วกดบันทึก
 * 3. เลือกฟังก์ชัน createDormitorySurvey แล้วกด "เรียกใช้" (Run)
 * 4. อนุญาตสิทธิ์ตามที่ Google ถาม (ครั้งแรกครั้งเดียว)
 * 5. เปิด "บันทึกการดำเนินการ" (Execution log) จะเห็นลิงก์ฟอร์มสำหรับส่งให้ผู้ตอบ
 *    ลิงก์สำหรับแก้ไขฟอร์ม และลิงก์ Google Sheets ที่เก็บคำตอบ
 */
function createDormitorySurvey() {
  var LEVELS = ['5 มากที่สุด', '4 มาก', '3 ปานกลาง', '2 น้อย', '1 น้อยที่สุด'];

  var form = FormApp.create('แบบสอบถามความพึงพอใจต่อการใช้งานแอป Dormitory');
  form
    .setDescription(
      'แบบสอบถามนี้จัดทำขึ้นเพื่อประเมินความพึงพอใจต่อการใช้งานระบบบริหารจัดการหอพัก (Dormitory) ' +
        'ประกอบด้วย 3 ส่วน ได้แก่ ข้อมูลทั่วไป ความพึงพอใจต่อการใช้งาน และข้อเสนอแนะ\n\n' +
        'เกณฑ์การให้คะแนน: 5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด\n' +
        'ข้อมูลของท่านจะใช้เพื่อการศึกษาเท่านั้น ขอขอบคุณที่สละเวลาตอบแบบสอบถาม'
    )
    .setProgressBar(true)
    .setCollectEmail(false)
    .setConfirmationMessage('ขอบคุณที่ตอบแบบสอบถามครับ/ค่ะ');

  // Satisfaction questions: one grid per aspect, rated 5 down to 1
  var addAspect = function (title, rows) {
    form.addGridItem().setTitle(title).setRows(rows).setColumns(LEVELS).setRequired(true);
  };

  // ---------- ส่วนที่ 1 ข้อมูลทั่วไป ----------
  form.addSectionHeaderItem().setTitle('ส่วนที่ 1 ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม');

  var role = form.addMultipleChoiceItem().setTitle('1. สถานะผู้ใช้งาน').setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('2. เพศ')
    .setChoiceValues(['ชาย', 'หญิง', 'ไม่ระบุ'])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('3. อายุ')
    .setChoiceValues(['ต่ำกว่า 20 ปี', '20–30 ปี', '31–40 ปี', '41 ปีขึ้นไป'])
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('4. อุปกรณ์ที่ใช้งาน (เลือกได้มากกว่า 1 ข้อ)')
    .setChoiceValues(['iPhone', 'โทรศัพท์ Android', 'คอมพิวเตอร์ / แท็บเล็ต'])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('5. ความถี่ในการใช้งานแอป')
    .setChoiceValues(['ทุกวัน', 'สัปดาห์ละครั้ง', 'เดือนละครั้ง', 'นานๆ ครั้ง'])
    .setRequired(true);

  // ---------- ส่วนสำหรับผู้ดูแลหอพัก (ผู้เช่าข้ามส่วนนี้) ----------
  var adminPage = form
    .addPageBreakItem()
    .setTitle('ส่วนที่ 2 (สำหรับผู้ดูแลหอพัก) ความพึงพอใจต่อฟังก์ชันผู้ดูแลระบบ');

  addAspect('ด้านการบริหารจัดการสำหรับผู้ดูแลหอพัก', [
    'จัดการห้องพัก บัญชีผู้เช่า และครุภัณฑ์ได้สะดวก',
    'อัปเดตสถานะงานซ่อมและบันทึกค่าซ่อมได้ง่าย',
    'แดชบอร์ดแสดงข้อมูลที่ช่วยในการตัดสินใจ (อัตราการเข้าพัก รายได้ งานซ่อมค้าง)',
    'ตัวกรองช่วงวัน เดือน ปี บนแดชบอร์ดใช้งานได้ตรงความต้องการ',
    'การส่งออกรายงานเป็นไฟล์ CSV มีประโยชน์',
    'การประกาศข่าวสารถึงผู้เช่าทำได้สะดวก',
  ]);

  // ---------- ส่วนที่ 2 ความพึงพอใจ (ทุกคนตอบ) ----------
  var commonPage = form.addPageBreakItem().setTitle('ส่วนที่ 2 ความพึงพอใจต่อการใช้งานแอป Dormitory');

  addAspect('ด้านที่ 1 ความสามารถของระบบ (Functional)', [
    'การเข้าสู่ระบบทำได้ง่ายและถูกต้อง',
    'การแจ้งซ่อมพร้อมแนบรูปภาพทำได้สะดวก',
    'ติดตามสถานะงานซ่อมได้ชัดเจน',
    'ดูประวัติการซ่อมที่เสร็จแล้วได้',
    'ฟังก์ชันเช็คอุปกรณ์ในห้องช่วยตรวจสอบครุภัณฑ์ได้ครบถ้วน',
    'ได้รับข่าวสารและประกาศจากหอพักทันเวลา',
    'การแจ้งเตือน (Notification) ทำงานถูกต้อง',
  ]);

  addAspect('ด้านที่ 2 ความง่ายในการใช้งาน (Usability)', [
    'เมนูและการจัดวางหน้าจอเข้าใจง่าย',
    'ใช้งานได้ด้วยตนเองโดยไม่ต้องมีผู้สอน',
    'ข้อความและคำแนะนำในแอปชัดเจน',
    'ใช้งานบนโทรศัพท์มือถือได้สะดวก',
  ]);

  addAspect('ด้านที่ 3 การออกแบบส่วนติดต่อผู้ใช้ (UI Design)', [
    'สีสันและรูปแบบหน้าจอสวยงาม เหมาะสม',
    'ขนาดตัวอักษรและไอคอนอ่านง่าย',
    'การออกแบบมีความสม่ำเสมอทั้งแอป',
  ]);

  addAspect('ด้านที่ 4 ประสิทธิภาพของระบบ (Performance)', [
    'แอปโหลดและตอบสนองได้รวดเร็ว',
    'ข้อมูลที่แสดงถูกต้องและเป็นปัจจุบัน',
    'ระบบทำงานได้เสถียร ไม่ค้างหรือหลุดบ่อย',
  ]);

  addAspect('ด้านที่ 5 ความปลอดภัยของข้อมูล (Security)', [
    'รู้สึกมั่นใจในความปลอดภัยของข้อมูลส่วนตัว',
    'ผู้ใช้แต่ละคนเห็นเฉพาะข้อมูลที่ตนมีสิทธิ์',
  ]);

  addAspect('ด้านที่ 6 ประโยชน์ที่ได้รับ (Usefulness)', [
    'ช่วยลดเวลาและขั้นตอนในการแจ้งซ่อมเมื่อเทียบกับวิธีเดิม',
    'การสื่อสารระหว่างผู้เช่ากับหอพักสะดวกขึ้น',
    'โดยรวมพึงพอใจและต้องการใช้งานต่อไป',
  ]);

  // ---------- ส่วนที่ 3 ข้อเสนอแนะ ----------
  form.addPageBreakItem().setTitle('ส่วนที่ 3 ข้อเสนอแนะ');
  form.addParagraphTextItem().setTitle('1. ฟังก์ชันที่ท่านชอบมากที่สุด และเหตุผล');
  form.addParagraphTextItem().setTitle('2. ปัญหาหรือความไม่สะดวกที่พบระหว่างการใช้งาน');
  form
    .addParagraphTextItem()
    .setTitle('3. ฟังก์ชันที่ต้องการให้เพิ่มเติม')
    .setHelpText('เช่น ชำระค่าเช่าออนไลน์ แจ้งเตือนผ่าน LINE ใบแจ้งหนี้ค่าน้ำค่าไฟ');

  // Tenants skip the admin-only section; admins answer it, then continue to the common one
  role.setChoices([
    role.createChoice('ผู้เช่า', commonPage),
    role.createChoice('ผู้ดูแลหอพัก', adminPage),
  ]);

  // Collect responses in a spreadsheet for the mean / S.D. analysis
  var sheet = SpreadsheetApp.create('คำตอบ - แบบสอบถามความพึงพอใจแอป Dormitory');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('ลิงก์สำหรับส่งให้ผู้ตอบ: ' + form.getPublishedUrl());
  Logger.log('ลิงก์สำหรับแก้ไขฟอร์ม: ' + form.getEditUrl());
  Logger.log('ลิงก์ Google Sheets เก็บคำตอบ: ' + sheet.getUrl());
}
