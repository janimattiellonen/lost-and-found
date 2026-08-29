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
  externalId?: string;
  /** The Google Sheet row number. Null for discs added through the web app. */
  internalDiscId: number | null;
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
  /** ISO date (y-MM-dd) the disc was handed back. */
  returnedToOwnerDate?: string | null;
  /** See ReturnMethod in app/features/discReturn/returnMethod.ts. */
  returnMethod?: number | null;
  canBeSoldOrDonated?: boolean;
  canBeSoldOrDonatedText?: string | null;
  /** ISO date (y-MM-dd) the disc was released for sale or donation. */
  canBeSoldOrDonatedDate?: string | null;
  /** See DisposalMethod in app/features/discDisposal/disposalMethod.ts. */
  canBeSoldOrDonatedMethod?: number | null;
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

export type DiscFoundNotificationDTO = {
  id?: number;
  createdAt?: string | null;
  clubId: number;
  courseName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  message?: string | null;
  readAt?: string | null;
};

export type BinFullNotificationDTO = {
  id?: number;
  createdAt?: string | null;
  clubId: number;
  courseName: string;
  readAt?: string | null;
};

export type DbDiscType = {
  id?: number | null;
  external_id?: string;
  internal_disc_id: number | null;
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
  returned_to_owner_date?: string | null;
  return_method?: number | null;
  can_be_sold_or_donated?: boolean;
  can_be_sold_or_donated_text?: string | null;
  can_be_sold_or_donated_date?: string | null;
  can_be_sold_or_donated_method?: number | null;
  club_id: number;
  course?: string | null;
  notified_at?: string | null;
};
