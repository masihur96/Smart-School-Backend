import re

with open('src/dashboard/dashboard.service.ts', 'r') as f:
    content = f.read()

new_block = """  async getAdminDashboard(schoolId: string) {
    const today = getLocalDateString();

    const [
      attendTeacher,
      attendStudent,
      recentHomework,
      recentNotice,
      currentExam,
    ] = await Promise.all([
      this.getAdminTeacherAttendance(schoolId, today).catch((err) => {
        console.error('[Dashboard] getAdminTeacherAttendance failed:', err?.message);
        return null;
      }),
      this.getAdminStudentAttendance(schoolId, today).catch((err) => {
        console.error('[Dashboard] getAdminStudentAttendance failed:', err?.message);
        return null;
      }),
      this.getAdminRecentHomework(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminRecentHomework failed:', err?.message);
        return null;
      }),
      this.getAdminRecentNotice(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminRecentNotice failed:', err?.message);
        return null;
      }),
      this.getAdminCurrentExam(schoolId).catch((err) => {
        console.error('[Dashboard] getAdminCurrentExam failed:', err?.message);
        return null;
      }),
    ]);

    return {
      attendTeacher,
      attendStudent,
      recentHomework,
      recentNotice,
      currentExam,
    };
  }

  private async getAdminTeacherAttendance(schoolId: string, date: string) {
    const allTeachers = await this.userRepo.count({
      where: { schoolId, role: UserRole.TEACHER, isActive: true },
    });

    const presentRecords = await this.teacherAttendanceRepo
      .createQueryBuilder('ta')
      .where('ta.schoolId = :schoolId', { schoolId })
      .andWhere('ta.date = :date', { date })
      .getMany();

    const enrichedRecords = await Promise.all(
      presentRecords.map(async (r) => {
        const teacher = r.teacherId
          ? await this.userRepo.findOne({
              where: { id: r.teacherId },
              select: ['id', 'name', 'avatar', 'lat', 'lon', 'radius'],
            })
          : null;
        return { ...r, teacher };
      }),
    );

    const presentCount = enrichedRecords.filter(
      (r) => r.status === 'clock-in',
    ).length;

    return {
      date,
      totalTeachers: allTeachers,
      present: presentCount,
      absent: allTeachers - presentCount,
      attendanceRate:
        allTeachers > 0
          ? parseFloat(((presentCount / allTeachers) * 100).toFixed(2))
          : 0,
      recentRecords: enrichedRecords.slice(0, 5),
    };
  }

  private async getAdminStudentAttendance(schoolId: string, date: string) {
    const allStudents = await this.userRepo.count({
      where: { schoolId, role: UserRole.STUDENT, isActive: true },
    });

    const records = await this.periodAttendanceRepo.find({
      where: { schoolId, date },
    });

    const enrichedRecords = await Promise.all(
      records.map(async (r) => {
        const student = await this.userRepo.findOne({
          where: { id: r.studentId },
          select: ['id', 'name', 'rollNumber', 'avatar'],
        });
        const classInfo = await this.classRepo.findOne({
          where: { id: r.classId },
          select: ['id', 'name'],
        });
        const subjectInfo = r.subjectId
          ? await this.subjectRepo.findOne({
              where: { id: r.subjectId },
              select: ['id', 'name', 'code'],
            })
          : null;
        const teacherInfo = r.teacherId
          ? await this.userRepo.findOne({
              where: { id: r.teacherId },
              select: ['id', 'name'],
            })
          : null;
        return { ...r, student, class: classInfo, subject: subjectInfo, teacher: teacherInfo };
      }),
    );

    const presentCount = enrichedRecords.filter(
      (r) =>
        r.status === PeriodAttendanceStatus.PRESENT ||
        r.status === PeriodAttendanceStatus.LATE,
    ).length;
    const absentCount = enrichedRecords.filter(
      (r) => r.status === PeriodAttendanceStatus.ABSENT,
    ).length;
    const leaveCount = enrichedRecords.filter(
      (r) => r.status === PeriodAttendanceStatus.LEAVE,
    ).length;

    return {
      date,
      totalStudents: allStudents,
      recorded: enrichedRecords.length,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      attendanceRate:
        enrichedRecords.length > 0
          ? parseFloat(
              ((presentCount / enrichedRecords.length) * 100).toFixed(2),
            )
          : 0,
      data: enrichedRecords,
    };
  }

  private async getAdminRecentHomework(schoolId: string) {
    const homeworks = await this.homeworkRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return Promise.all(
      homeworks.map(async (hw) => {
        const classInfo = await this.classRepo.findOne({
          where: { id: hw.classId },
          select: ['id', 'name'],
        });
        const subjectInfo = await this.subjectRepo.findOne({
          where: { id: hw.subjectId },
          select: ['id', 'name', 'code'],
        });
        const sectionInfo = hw.sectionId
          ? await this.sectionRepo.findOne({
              where: { id: hw.sectionId },
              select: ['id', 'name'],
            })
          : null;
        return { ...hw, classInfo, subjectInfo, sectionInfo };
      }),
    );
  }

  private async getAdminRecentNotice(schoolId: string) {
    return this.noticeRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private async getAdminCurrentExam(schoolId: string) {
    const schoolClasses = await this.classRepo.find({
      where: { schoolId },
      select: ['id'],
    });
    const classIds = schoolClasses.map((c) => c.id);

    if (classIds.length === 0) return [];

    const relevantAssignments = await this.academicAssignmentRepo
      .createQueryBuilder('aa')
      .select('DISTINCT aa.examId', 'examId')
      .where(`aa.class->>'uuid' IN (:...classIds)`, { classIds })
      .getRawMany();

    const relevantExamIds = relevantAssignments
      .map((a) => a.examId)
      .filter(Boolean);

    const exams =
      relevantExamIds.length > 0
        ? await this.examRepo
            .createQueryBuilder('exam')
            .where('exam.id IN (:...relevantExamIds)', { relevantExamIds })
            .orderBy('exam.start_date', 'DESC')
            .getMany()
        : [];

    const allAssignmentsForExams = relevantExamIds.length > 0
      ? await this.academicAssignmentRepo.find({
          where: { examId: In(relevantExamIds) },
        })
      : [];

    const today = getLocalDateString();

    const examList = await Promise.all(
      exams.map(async (e) => {
        let status: 'current' | 'recent' | 'upcoming';

        if (e.start_date && e.end_date) {
          if (e.start_date <= today && e.end_date >= today) {
            status = 'current';
          } else if (e.end_date < today) {
            status = 'recent';
          } else {
            status = 'upcoming';
          }
        } else {
          status = 'upcoming';
        }

        const examAssignments = allAssignmentsForExams.filter(
          (a) => a.examId === e.id,
        );

        return { ...e, assignments: examAssignments, status };
      }),
    );

    const order = { current: 0, upcoming: 1, recent: 2 };
    examList.sort((a, b) => order[a.status] - order[b.status]);

    return examList;
  }"""

pattern = re.compile(r"  async getAdminDashboard\(schoolId: string\) \{.*?  \}  // ─────────────────────────────────────────────────────────────\n  // TEACHER DASHBOARD", re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_block + "\n\n  // ─────────────────────────────────────────────────────────────\n  // TEACHER DASHBOARD", content)
    with open('src/dashboard/dashboard.service.ts', 'w') as f:
        f.write(new_content)
    print("Successfully replaced block.")
else:
    print("Block not found!")
