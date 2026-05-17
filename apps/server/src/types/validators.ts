// ─── Auth DTOs ──────────────────────────────────────────────────────────────

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ─── Room DTOs ──────────────────────────────────────────────────────────────

export interface CreateRoomDto {
  name: string;
  title?: string;
  content?: string;
  tags?: string[];
}

export interface UpdateRoomDto {
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}

export interface SetTagsDto {
  tags: string[];
}

// ─── Filters ────────────────────────────────────────────────────────────────

export interface FilterRoomsDto {
  search?: string;
  tags?: string;
  archived?: string;
  sort?: "updated" | "created";
}

// ─── Validation helpers ────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

export function validateSignup(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || !validateName(data.name)) {
    errors.push("Name must be 2-100 characters");
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email address");
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push("Password must be at least 8 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLogin(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email address");
  }

  if (!data.password) {
    errors.push("Password is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
