CREATE INDEX "penarikan_nasabah_created_idx" ON "penarikan" USING btree ("nasabah_id","created_at");--> statement-breakpoint
CREATE INDEX "penarikan_created_idx" ON "penarikan" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "setoran_nasabah_created_idx" ON "setoran" USING btree ("nasabah_id","created_at");--> statement-breakpoint
CREATE INDEX "setoran_created_idx" ON "setoran" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "setoran_jenis_idx" ON "setoran" USING btree ("jenis_sampah_id");