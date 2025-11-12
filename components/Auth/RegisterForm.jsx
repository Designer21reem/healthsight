"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function RegisterForm({ open, onClose }) {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!open) return;
		function onKey(e) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	function handleSubmit(e) {
		e.preventDefault();
		setError("");
		if (!username.trim() || !email.trim() || !password) {
			setError("Please fill in all fields.");
			return;
		}
		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}

		// Placeholder: replace with real registration call (lib/api.js)
		console.log("register", { username, email, password });
		onClose();
	}

	if (!open) return null;
	if (typeof document === "undefined") return null;

	const modal = (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />

			<div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-auto">
				<button
					aria-label="Close"
					onClick={onClose}
					className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100"
				>
					✕
				</button>

				<div className="mx-auto max-w-2xl">
					<h2 className="mb-6 text-center text-3xl font-extrabold tracking-tight">
						<span className="text-gray-900">sign up to your </span>
						<span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-violet-500">Health Companion</span>
					</h2>

					<form onSubmit={handleSubmit} className="space-y-4">
						{error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

						<div>
							<label className="mb-2 block text-sm text-gray-600">UserName</label>
							<input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
								placeholder="Zaynab Luay"
							/>
						</div>

						<div>
							<label className="mb-2 block text-sm text-gray-600">Email</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
								placeholder="you@example.com"
							/>
						</div>

						<div>
							<label className="mb-2 block text-sm text-gray-600">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
								placeholder="••••••••"
							/>
						</div>

						<div>
							<label className="mb-2 block text-sm text-gray-600">Confirm Password</label>
							<input
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
								placeholder="••••••••"
							/>
						</div>

						<button
							type="submit"
							className="mt-3 w-full rounded-full bg-linear-to-r from-pink-500 to-fuchsia-500 px-6 py-4 text-lg font-medium text-white shadow hover:opacity-95"
						>
							Sign up
						</button>

						<p className="mt-4 text-center text-sm text-gray-500">Already have an account? <button type="button" onClick={onClose} className="text-pink-500 hover:underline">Sign in</button></p>
					</form>
				</div>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}
