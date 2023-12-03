function makePermutation() {
	const permutation = [];
	for(let i = 0; i < 256; i++) {
		permutation.push(i);
	}

	//Shuffle
    for(let e = permutation.length-1; e > 0; e--) {
        const index = Math.round(Math.random()*(e-1));
        const temp = permutation[e];
        
        permutation[e] = permutation[index];
        permutation[index] = temp;
    }
	
	for(let i = 0; i < 256; i++) {
		permutation.push(permutation[i]);
	}
	
	return permutation;
}
const Permutation = makePermutation();

function getConstantVector(v) {
	// v is the value from the permutation table
	const h = v & 3;
	if(h == 0)
		return tmpvec2.set(1.0, 1.0);
	else if(h == 1)
		return tmpvec2.set(-1.0, 1.0);
	else if(h == 2)
		return tmpvec2.set(-1.0, -1.0);
	else
		return tmpvec2.set(1.0, -1.0);
}

function fade(t) {
	return ((6*t - 15)*t + 10)*t*t*t;
}

function Lerp(t, a1, a2) {
	return a1 + t*(a2-a1);
}

function noise2D(x, y) {
	const X = Math.floor(x) & 255;
	const Y = Math.floor(y) & 255;

	const xf = x-Math.floor(x);
	const yf = y-Math.floor(y);

	const topRight = new Vec2(xf-1.0, yf-1.0);
	const topLeft = new Vec2(xf, yf-1.0);
	const bottomRight = new Vec2(xf-1.0, yf);
	const bottomLeft = new Vec2(xf, yf);
	
	// Select a value from the permutation array for each of the 4 corners
	const valueTopRight = Permutation[Permutation[X+1]+Y+1];
	const valueTopLeft = Permutation[Permutation[X]+Y+1];
	const valueBottomRight = Permutation[Permutation[X+1]+Y];
	const valueBottomLeft = Permutation[Permutation[X]+Y];
	
	const dotTopRight = topRight.dot(getConstantVector(valueTopRight));
	const dotTopLeft = topLeft.dot(getConstantVector(valueTopLeft));
	const dotBottomRight = bottomRight.dot(getConstantVector(valueBottomRight));
	const dotBottomLeft = bottomLeft.dot(getConstantVector(valueBottomLeft));
	
	const u = fade(xf);
	const v = fade(yf);
	
	return Lerp(u,
		Lerp(v, dotBottomLeft, dotTopLeft),
		Lerp(v, dotBottomRight, dotTopRight)
	);
}

export { noise2D };