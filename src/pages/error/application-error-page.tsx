// src/pages/error/application-error-page.tsx
// TODO: Customize this page for better user experience and interactivity

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiWifiOff, FiSettings } from "react-icons/fi";
import { RxDashboard } from "react-icons/rx";
interface DataLoadingErrorProps {
  error: Error;
  title?: string;
  subtitle?: string;
}
import { BiErrorCircle } from "react-icons/bi";

export default function DataLoadingError({
  error,
  title = "Failed to Load Data",
  subtitle = "We encountered an issue while trying to load your data",
}: DataLoadingErrorProps) {
  const isNetworkError = error.message.includes("Network Error");
  const isServerError = error.message.includes("status code 50");
  const isEnvError = error.message.includes("environment");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#F0F6FC] to-[#FFFC] p-4 dark:from-[#0F172A] dark:to-[#1E293B]">
      <div className="w-full max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            {isNetworkError ? (
              <FiWifiOff className="h-10 w-10 text-red-600 dark:text-red-400" />
            ) : isServerError ? (
              <BiErrorCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            ) : isEnvError ? (
              <FiSettings className="h-10 w-10 text-red-600 dark:text-red-400" />
            ) : (
              <FiAlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
            )}
          </div>

          <h1 className="mt-8 text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
            {subtitle}
          </h2>

          <div className="mt-6 rounded-lg bg-gray-100 dark:bg-gray-800 p-4 text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Error details:
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-mono">
              {error.message}
            </p>
          </div>

          {isNetworkError && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Please check your internet connection and try again.
            </p>
          )}

          {isServerError && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Our servers are experiencing issues. Please try again later.
            </p>
          )}

          {isEnvError && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Please check your configuration files and environment variables.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex justify-center gap-4"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded bg-[#0785CF] px-6 py-3 font-medium text-white shadow transition-all hover:bg-[#0785CF]/90 hover:shadow"
          >
            <RxDashboard className="h-5 w-5" />
            Return to Dashboard
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded bg-gray-200 px-6 py-3 font-medium text-gray-800 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Retry
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 border-t border-gray-200 pt-10 dark:border-gray-700"
        >
          {/* <img
            src={safari_pro_logo}
            alt="SafariPro Logo"
            className="mx-auto h-8 dark:brightness-0 dark:invert"
          /> */}
          <span className="block">LOGO</span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            If the problem persists, please contact our support team.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <a
              href="mailto:support@safaripro.com"
              className="flex items-center gap-2 text-gray-600 hover:text-[#0785CF] font-medium dark:text-[#0785CF] dark:hover:text-[#0785CF]"
            >
              Email Support
            </a>
            <a
              href="tel:+255689759215"
              className="flex items-center gap-2 text-gray-600 hover:text-[#0785CF] font-medium dark:text-[#0785CF] dark:hover:text-[#0785CF]"
            >
              Call Us
            </a>
            <Link
              to="/help-center"
              className="flex items-center gap-2 text-gray-600 hover:text-[#0785CF] font-medium dark:text-[#0785CF] dark:hover:text-[#0785CF]"
            >
              Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
