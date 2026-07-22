-- A teacher can be the form teacher of at most one class.
ALTER TABLE "classes" ADD CONSTRAINT "classes_formTeacherId_key" UNIQUE ("formTeacherId");
