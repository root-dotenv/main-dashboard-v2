// - - - src/pages/error/coming-soon.tsx - -
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({
  title = "Coming Soon!",
  description,
}: ComingSoonProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#1e223b]">
      <div className="w-full max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Rocket className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {description || (
              <>
                We are working hard to bring you this exciting new feature.
                <br />
                Stay tuned for updates!
              </>
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex justify-center gap-4"
        >
          <Button asChild className="h-11 px-6">
            <Link to="/">Go Back to Dashboard</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
