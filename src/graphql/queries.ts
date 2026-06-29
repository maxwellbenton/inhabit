import { gql } from '@apollo/client';

export interface Reminder {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  time: string;
  days: number[];
  color: string;
  enabled: boolean;
  skipDates: string[];
}

export interface WorkBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  workMin: number;
  breakMin: number;
  days: number[];
  enabled: boolean;
}

export interface Settings {
  takeoverSeconds: number;
}

export interface ReminderInput {
  title: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  time: string;
  days?: number[];
  color?: string;
  enabled?: boolean;
}

export interface WorkBlockInput {
  label: string;
  start: string;
  end: string;
  workMin?: number;
  breakMin?: number;
  days?: number[];
  enabled?: boolean;
}

export const REMINDERS_QUERY = gql`
  query Reminders {
    reminders {
      id
      title
      body
      imageUrl
      videoUrl
      time
      days
      color
      enabled
      skipDates
    }
  }
`;

export const WORKBLOCKS_QUERY = gql`
  query WorkBlocks {
    workBlocks {
      id
      label
      start
      end
      workMin
      breakMin
      days
      enabled
    }
  }
`;

export const SETTINGS_QUERY = gql`
  query Settings {
    settings {
      takeoverSeconds
    }
  }
`;

export const CREATE_REMINDER = gql`
  mutation CreateReminder($input: ReminderInput!) {
    createReminder(input: $input) {
      id
    }
  }
`;

export const UPDATE_REMINDER = gql`
  mutation UpdateReminder($id: ID!, $input: ReminderInput!) {
    updateReminder(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_REMINDER = gql`
  mutation DeleteReminder($id: ID!) {
    deleteReminder(id: $id)
  }
`;

export const SKIP_REMINDER_TODAY = gql`
  mutation SkipReminderToday($id: ID!, $date: String!) {
    skipReminderToday(id: $id, date: $date) {
      id
    }
  }
`;

export const CREATE_WORKBLOCK = gql`
  mutation CreateWorkBlock($input: WorkBlockInput!) {
    createWorkBlock(input: $input) {
      id
    }
  }
`;

export const UPDATE_WORKBLOCK = gql`
  mutation UpdateWorkBlock($id: ID!, $input: WorkBlockInput!) {
    updateWorkBlock(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_WORKBLOCK = gql`
  mutation DeleteWorkBlock($id: ID!) {
    deleteWorkBlock(id: $id)
  }
`;

export const UPDATE_SETTINGS = gql`
  mutation UpdateSettings($takeoverSeconds: Int!) {
    updateSettings(takeoverSeconds: $takeoverSeconds) {
      takeoverSeconds
    }
  }
`;
