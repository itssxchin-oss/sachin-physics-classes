import { redirect } from "next/navigation";

interface Props {
  params: { id: string; lectureId: string };
}

/**
 * The old /courses/[id]/lecture/[lectureId] route is no longer used.
 * The simplified /lecture/[lectureId] route handles all lecture playback.
 */
export default function OldLecturePage({ params }: Props) {
  redirect(`/lecture/${params.lectureId}`);
}