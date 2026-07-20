export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["OWNER"] = "OWNER";
    UserRole["HR"] = "HR";
    UserRole["FINANCE"] = "FINANCE";
    UserRole["CEO"] = "CEO";
    UserRole["AUDITOR"] = "AUDITOR";
    UserRole["EMPLOYEE"] = "EMPLOYEE";
})(UserRole || (UserRole = {}));
export var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["ACTIVE"] = "ACTIVE";
    EmploymentStatus["INACTIVE"] = "INACTIVE";
    EmploymentStatus["ONBOARDING"] = "ONBOARDING";
    EmploymentStatus["ON_LEAVE"] = "ON_LEAVE";
    EmploymentStatus["TERMINATED"] = "TERMINATED";
})(EmploymentStatus || (EmploymentStatus = {}));
export var CompensationType;
(function (CompensationType) {
    CompensationType["SALARY"] = "SALARY";
    CompensationType["BONUS"] = "BONUS";
    CompensationType["ALLOWANCE"] = "ALLOWANCE";
})(CompensationType || (CompensationType = {}));
export var CompensationFrequency;
(function (CompensationFrequency) {
    CompensationFrequency["HOURLY"] = "HOURLY";
    CompensationFrequency["WEEKLY"] = "WEEKLY";
    CompensationFrequency["BIWEEKLY"] = "BIWEEKLY";
    CompensationFrequency["SEMIMONTHLY"] = "SEMIMONTHLY";
    CompensationFrequency["MONTHLY"] = "MONTHLY";
    CompensationFrequency["QUARTERLY"] = "QUARTERLY";
    CompensationFrequency["ANNUALLY"] = "ANNUALLY";
    CompensationFrequency["ONE_TIME"] = "ONE_TIME";
})(CompensationFrequency || (CompensationFrequency = {}));
export var PayrollStatus;
(function (PayrollStatus) {
    PayrollStatus["DRAFT"] = "DRAFT";
    PayrollStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    PayrollStatus["APPROVED"] = "APPROVED";
    PayrollStatus["PROCESSING"] = "PROCESSING";
    PayrollStatus["COMPLETED"] = "COMPLETED";
    PayrollStatus["FAILED"] = "FAILED";
    PayrollStatus["CANCELLED"] = "CANCELLED";
})(PayrollStatus || (PayrollStatus = {}));
export var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
    ApprovalStatus["SKIPPED"] = "SKIPPED";
})(ApprovalStatus || (ApprovalStatus = {}));
export var ApprovalLevel;
(function (ApprovalLevel) {
    ApprovalLevel["HR"] = "HR";
    ApprovalLevel["FINANCE"] = "FINANCE";
    ApprovalLevel["CEO"] = "CEO";
})(ApprovalLevel || (ApprovalLevel = {}));
export var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
    InvitationStatus["REVOKED"] = "REVOKED";
})(InvitationStatus || (InvitationStatus = {}));
export var InvitationType;
(function (InvitationType) {
    InvitationType["EMPLOYEE"] = "EMPLOYEE";
    InvitationType["USER"] = "USER";
})(InvitationType || (InvitationType = {}));
export var AuditAction;
(function (AuditAction) {
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_REGISTERED"] = "USER_REGISTERED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["ORGANIZATION_CREATED"] = "ORGANIZATION_CREATED";
    AuditAction["ORGANIZATION_UPDATED"] = "ORGANIZATION_UPDATED";
    AuditAction["EMPLOYEE_CREATED"] = "EMPLOYEE_CREATED";
    AuditAction["EMPLOYEE_UPDATED"] = "EMPLOYEE_UPDATED";
    AuditAction["EMPLOYEE_DELETED"] = "EMPLOYEE_DELETED";
    AuditAction["COMPENSATION_CREATED"] = "COMPENSATION_CREATED";
    AuditAction["COMPENSATION_UPDATED"] = "COMPENSATION_UPDATED";
    AuditAction["COMPENSATION_ENDED"] = "COMPENSATION_ENDED";
    AuditAction["PAYROLL_CREATED"] = "PAYROLL_CREATED";
    AuditAction["PAYROLL_UPDATED"] = "PAYROLL_UPDATED";
    AuditAction["PAYROLL_GENERATED"] = "PAYROLL_GENERATED";
    AuditAction["PAYROLL_SUBMITTED"] = "PAYROLL_SUBMITTED";
    AuditAction["PAYROLL_APPROVED"] = "PAYROLL_APPROVED";
    AuditAction["PAYROLL_REJECTED"] = "PAYROLL_REJECTED";
    AuditAction["PAYROLL_EXECUTED"] = "PAYROLL_EXECUTED";
    AuditAction["PAYROLL_CANCELLED"] = "PAYROLL_CANCELLED";
    AuditAction["APPROVAL_CREATED"] = "APPROVAL_CREATED";
    AuditAction["APPROVAL_APPROVED"] = "APPROVAL_APPROVED";
    AuditAction["APPROVAL_REJECTED"] = "APPROVAL_REJECTED";
    AuditAction["INVITATION_SENT"] = "INVITATION_SENT";
    AuditAction["INVITATION_ACCEPTED"] = "INVITATION_ACCEPTED";
    AuditAction["INVITATION_REVOKED"] = "INVITATION_REVOKED";
    AuditAction["SETTINGS_UPDATED"] = "SETTINGS_UPDATED";
    AuditAction["NOTIFICATION_READ"] = "NOTIFICATION_READ";
})(AuditAction || (AuditAction = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["ERROR"] = "ERROR";
    NotificationType["APPROVAL"] = "APPROVAL";
    NotificationType["PAYROLL"] = "PAYROLL";
    NotificationType["INVITATION"] = "INVITATION";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (NotificationType = {}));
export var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["ACTIVE"] = "ACTIVE";
    OrganizationStatus["INACTIVE"] = "INACTIVE";
    OrganizationStatus["SUSPENDED"] = "SUSPENDED";
})(OrganizationStatus || (OrganizationStatus = {}));
//# sourceMappingURL=enums.js.map