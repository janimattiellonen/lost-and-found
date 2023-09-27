export type clubType = {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
};

export type SyncLogType = {
  id: number;
  clubId: number;
  updatedAt: string;
};

export type EmptyingLogDTO = {
  id: number;
  createdAt: string;
  clubId: number;
  courseName: string;
  emptiedAt?: string | null;
};

export type ClubDTO = {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  syncLog?: SyncLogType;
};

export type DiscDTO = {
  id?: number;
  internalDiscId: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  discName: string;
  discColour: string;
  discManufacturer?: string | null;
  ownerName?: string | null;
  ownerPhoneNumber?: string;
  ownerEmailAddress?: string;
  clubId: number;
  notifiedAt?: string;
  additionalInfo?: string;
  isReturnedToOwner?: boolean | null;
  returnedToOwnerText?: string | null;
  canBeSoldOrDonated?: boolean;
  canBeSoldOrDonatedText?: string | null;
  ownerClubName?: string | null;
  addedAt?: string;
  course?: string | null;
};

export type MessageTemplateDTO = {
  id?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  clubId: number;
  content: string;
  isDefault?: boolean | null;
};

export type MessageLogDTO = {
  id?: number;
  sentAt?: string | null;
  internalDiscId: number;
  clubId: number;
  content: string;
};

export type DbDiscType = {
  id?: number | null;
  internal_disc_id: number;
  created_at?: string | null;
  updated_at?: string | null;
  disc_name: string;
  disc_colour: string;
  disc_manufacturer?: string | null;
  owner_name?: string | null;
  owner_phone_number?: string;
  owner_email_address?: string;
  owner_club_name?: string | null;
  added_at?: string | null;
  additional_info?: string | null;
  is_returned_to_owner?: boolean | null;
  returned_to_owner_text?: string | null;
  can_be_sold_or_donated?: boolean;
  can_be_sold_or_donated_text?: string | null;
  club_id: number;
  course?: string | null;
};

/*
export type authorBookType = {
  authorId?: number;
  bookId?: number;
  author: authorType;
};

export type bookType = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  language: string;
  pageCount: number;
  startedReading?: string;
  finishedReading?: string;
  rating?: number;
  price?: number;
  format: string;
  isRead: boolean;

  author_book: Array<authorBookType>;
};

export type dbAuthorType = {
  id: number;
  first_name: number;
  last_name: number;
};

export type dbAuthorBookType = {
  author: dbAuthorType;
};

export type dbBbookType = {
  id: number;
  created_at?: string;
  updated_at?: string;
  title: string;
  language: string;
  page_count: number;
  started_reading?: string;
  finished_reading?: string;
  rating?: number;
  price?: number;
  format: string;
  is_read: boolean;

  author_book: Array<dbAuthorBookType>;
};

export type authorDTO = {
  id: number;
  firstName: number;
  lastName: number;
};

export type authorBookDTO = {
  authorId?: number;
  bookId?: number;
  author: authorDTO;
};

export type bookDTO = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  language: string;
  pageCount: number;
  startedReading?: string;
  finishedReading?: string;
  rating?: number;
  price?: number;
  format: string;
  isRead: boolean;

  authors: Array<authorDTO>;
};

type bookCountType = Array<{
  language: string;
  count: number;
}>;

export type statsDTO = {
  authorCount: number;
  bookCount: bookCountType;
};
*/
