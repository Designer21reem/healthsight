"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function LoginForm({ open, onClose }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		function onKey(e) {
			if (e.key === "Escape") onClose();
		}
		if (open) window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	function handleSubmit(e) {
		e.preventDefault();
		// Placeholder: implement real auth flow
		console.log("login", { email, password });
		onClose();
	}

	if (!open) return null;
	if (typeof document === "undefined") return null;

	const modal = (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />

			<div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-auto">
				<button
					aria-label="Close"
					onClick={onClose}
					className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100"
				>
					✕
				</button>

				<header className="mb-6 text-center">
					<h2 className="text-2xl font-extrabold">sign in to your <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-pink-500">Health Companion</span></h2>
				</header>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="mb-2 block text-sm text-gray-600">Email</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm text-gray-600">Password</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
							placeholder="••••••••"
						/>
					</div>

					<div className="flex items-center justify-between">
						<div />
						<a className="text-sm text-indigo-600 hover:underline" href="#">Forgot your password?</a>
					</div>

					<button
						type="submit"
						className="w-full rounded-full bg-indigo-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-indigo-700"
					>
						Log in
					</button>

					<div className="my-4 flex items-center gap-4">
						<hr className="flex-1 border-gray-200" />
						<span className="text-sm text-gray-400">OR</span>
						<hr className="flex-1 border-gray-200" />
					</div>

					<button type="button" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm">
						<img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
						Continue with Google
					</button>

					<p className="mt-4 text-center text-sm text-gray-500">Don’t have an account? <a className="text-indigo-600 hover:underline" href="#">Sign up</a></p>
				</form>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}

