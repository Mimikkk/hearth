// Put here your GLSL code to transpile to TSL:

float V_GGX_SmithCorrelated(const in float alpha, const in float dotNL, const in float dotNV) {
	float a2 = pow2(alpha);

	float gv = dotNL * sqrt(a2 + (1.0 - a2) * pow2(dotNV));
	float gl = dotNV * sqrt(a2 + (1.0 - a2) * pow2(dotNL));

	return 0.5 / max(gv + gl, EPSILON);

}
