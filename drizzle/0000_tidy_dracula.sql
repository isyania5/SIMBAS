CREATE TYPE "public"."user_role" AS ENUM('admin', 'warga');--> statement-breakpoint
CREATE TABLE "jenis_sampah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(100) NOT NULL,
	"harga_per_kg" integer NOT NULL,
	"deskripsi" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jenis_sampah_harga_positive" CHECK ("jenis_sampah"."harga_per_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "nasabah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nama" varchar(120) NOT NULL,
	"alamat" text DEFAULT '' NOT NULL,
	"no_telepon" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penarikan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"nasabah_id" uuid NOT NULL,
	"jumlah_rupiah" integer NOT NULL,
	"keterangan" varchar(240) DEFAULT '' NOT NULL,
	"dicatat_oleh" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "penarikan_jumlah_positive" CHECK ("penarikan"."jumlah_rupiah" > 0)
);
--> statement-breakpoint
CREATE TABLE "setoran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"nasabah_id" uuid NOT NULL,
	"jenis_sampah_id" uuid NOT NULL,
	"berat_kg" numeric(10, 3) NOT NULL,
	"harga_per_kg" integer NOT NULL,
	"nilai_rupiah" integer NOT NULL,
	"dicatat_oleh" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "setoran_berat_positive" CHECK ("setoran"."berat_kg" > 0),
	CONSTRAINT "setoran_harga_positive" CHECK ("setoran"."harga_per_kg" > 0),
	CONSTRAINT "setoran_nilai_positive" CHECK ("setoran"."nilai_rupiah" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "public"."nasabah"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_dicatat_oleh_users_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "public"."nasabah"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_jenis_sampah_id_jenis_sampah_id_fk" FOREIGN KEY ("jenis_sampah_id") REFERENCES "public"."jenis_sampah"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_dicatat_oleh_users_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "jenis_sampah_nama_unique" ON "jenis_sampah" USING btree ("nama");--> statement-breakpoint
CREATE UNIQUE INDEX "nasabah_user_id_unique" ON "nasabah" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nasabah_no_telepon_unique" ON "nasabah" USING btree ("no_telepon");--> statement-breakpoint
CREATE UNIQUE INDEX "penarikan_idempotency_unique" ON "penarikan" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "setoran_idempotency_unique" ON "setoran" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");