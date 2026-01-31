
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { UpdateComposer } from "@/components/feature/UpdateComposer";
import { redirect } from "next/navigation";

export default async function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id: id },
        include: { org: { include: { users: true } } }
    });

    if (!project) return <div>Project Not Found</div>;

    const hasAccess = project.org.users.some((u: typeof project.org.users[0]) => u.userId === session.user?.id);
    // Optional: Also allow Recipient access via magic link later, but for composer it's user only
    if (!hasAccess) return <div>Unauthorized</div>;

    return <UpdateComposer projectId={project.id} projectName={project.name} />;
}
