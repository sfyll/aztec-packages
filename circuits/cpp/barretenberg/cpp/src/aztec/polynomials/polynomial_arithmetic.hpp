#pragma once
#include "evaluation_domain.hpp"

#ifndef NO_MULTITHREADING
#include <omp.h>
#endif

namespace barretenberg {
namespace polynomial_arithmetic {
struct lagrange_evaluations {
    fr vanishing_poly;
    fr l_start;
    fr l_end;
};

fr evaluate(const fr* coeffs, const fr& z, const size_t n);
fr evaluate(const std::vector<fr*> coeffs, const fr& z, const size_t large_n);
void copy_polynomial(const fr* src, fr* dest, size_t num_src_coefficients, size_t num_target_coefficients);

//  2. Compute a lookup table of the roots of unity, and suffer through cache misses from nonlinear access patterns
void fft_inner_serial(std::vector<fr*> coeffs, const size_t domain_size, const std::vector<fr*>& root_table);
void fft_inner_parallel(std::vector<fr*> coeffs,
                        const evaluation_domain& domain,
                        const fr&,
                        const std::vector<fr*>& root_table);

void fft(fr* coeffs, const evaluation_domain& domain);
void fft(fr* coeffs, fr* target, const evaluation_domain& domain);
void fft(std::vector<fr*> coeffs, const evaluation_domain& domain);
void fft_with_constant(fr* coeffs, const evaluation_domain& domain, const fr& value);

void coset_fft(fr* coeffs, const evaluation_domain& domain);
void coset_fft(fr* coeffs, fr* target, const evaluation_domain& domain);
void coset_fft(std::vector<fr*> coeffs, const evaluation_domain& domain);
void coset_fft(fr* coeffs,
               const evaluation_domain& small_domain,
               const evaluation_domain& large_domain,
               const size_t domain_extension);

void coset_fft_with_constant(fr* coeffs, const evaluation_domain& domain, const fr& constant);
void coset_fft_with_generator_shift(fr* coeffs, const evaluation_domain& domain, const fr& constant);

void ifft(fr* coeffs, const evaluation_domain& domain);
void ifft(fr* coeffs, fr* target, const evaluation_domain& domain);
void ifft(std::vector<fr*> coeffs, const evaluation_domain& domain);

void ifft_with_constant(fr* coeffs, const evaluation_domain& domain, const fr& value);

void coset_ifft(fr* coeffs, const evaluation_domain& domain);
void coset_ifft(std::vector<fr*> coeffs, const evaluation_domain& domain);

void partial_fft_serial_inner(fr* coeffs,
                              fr* target,
                              const evaluation_domain& domain,
                              const std::vector<fr*>& root_table);
void partial_fft_parellel_inner(fr* coeffs,
                                const evaluation_domain& domain,
                                const std::vector<fr*>& root_table,
                                fr constant = 1,
                                bool is_coset = false);

void partial_fft_serial(fr* coeffs, fr* target, const evaluation_domain& domain);
void partial_fft(fr* coeffs, const evaluation_domain& domain, fr constant = 1, bool is_coset = false);

void add(const fr* a_coeffs, const fr* b_coeffs, fr* r_coeffs, const evaluation_domain& domain);
void sub(const fr* a_coeffs, const fr* b_coeffs, fr* r_coeffs, const evaluation_domain& domain);

void mul(const fr* a_coeffs, const fr* b_coeffs, fr* r_coeffs, const evaluation_domain& domain);

// For L_1(X) = (X^{n} - 1 / (X - 1)) * (1 / n)
// Compute the size k*n-fft of L_1(X), where k is determined by the target domain (e.g. large_domain -> 4*n)
// We can use this to compute the k*n-fft evaluations of any L_i(X).
// We can consider `l_1_coefficients` to be a k*n-sized vector of the evaluations of L_1(X),
// for all X = k*n'th roots of unity.
// To compute the vector for the k*n-fft transform of L_i(X), we perform a (k*i)-left-shift of this vector
void compute_lagrange_polynomial_fft(fr* l_1_coefficients,
                                     const evaluation_domain& src_domain,
                                     const evaluation_domain& target_domain);

void divide_by_pseudo_vanishing_polynomial(std::vector<fr*> coeffs,
                                           const evaluation_domain& src_domain,
                                           const evaluation_domain& target_domain,
                                           const size_t num_roots_cut_out_of_vanishing_polynomial = 4);

// void populate_with_vanishing_polynomial(fr* coeffs, const size_t num_non_zero_entries, const evaluation_domain&
// src_domain, const evaluation_domain& target_domain);

fr compute_kate_opening_coefficients(const fr* src, fr* dest, const fr& z, const size_t n);

// compute Z_H*(z), l_start(z), l_{end}(z) (= l_{n-4}(z))
lagrange_evaluations get_lagrange_evaluations(const fr& z,
                                              const evaluation_domain& domain,
                                              const size_t num_roots_cut_out_of_vanishing_polynomial = 4);
fr compute_barycentric_evaluation(const fr* coeffs,
                                  const size_t num_coeffs,
                                  const fr& z,
                                  const evaluation_domain& domain);
// Convert an fft with `current_size` point evaluations, to one with `current_size >> compress_factor` point evaluations
void compress_fft(const fr* src, fr* dest, const size_t current_size, const size_t compress_factor);

fr evaluate_from_fft(const fr* poly_coset_fft,
                     const evaluation_domain& large_domain,
                     const fr& z,
                     const evaluation_domain& small_domain);

// This function computes sum of all scalars in a given array.
fr compute_sum(const fr* src, const size_t n);

// This function computes the polynomial (x - a)(x - b)(x - c)... given n distinct roots (a, b, c, ...).
void compute_linear_polynomial_product(const fr* roots, fr* dest, const size_t n);

// This function evaluates the polynomial (x - a)(x - b)(x - c)... given n distinct roots (a, b, c, ...)
// at x = z.
fr compute_linear_polynomial_product_evaluation(const fr* roots, const fr z, const size_t n);

// This function computes the lagrange (or coset-lagrange) form of the polynomial (x - a)(x - b)(x - c)...
// given n distinct roots (a, b, c, ...).
void fft_linear_polynomial_product(
    const fr* roots, fr* dest, const size_t n, const evaluation_domain& domain, const bool is_coset = false);

// This function interpolates from points {(z_1, f(z_1)), (z_2, f(z_2)), ...}.
// `src` contains {f(z_1), f(z_2), ...}
void compute_interpolation(const fr* src, fr* dest, const fr* evaluation_points, const size_t n);

// This function interpolates from points {(z_1, f(z_1)), (z_2, f(z_2)), ...}
// using a single scalar inversion and Lagrange polynomial interpolation.
// `src` contains {f(z_1), f(z_2), ...}
void compute_efficient_interpolation(const fr* src, fr* dest, const fr* evaluation_points, const size_t n);

} // namespace polynomial_arithmetic
} // namespace barretenberg
