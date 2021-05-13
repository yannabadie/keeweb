import * as kdbxweb from 'kdbxweb';
import 'util/kdbxweb/protected-value';

const Ranking = {
    getStringRank(
        s1: string | kdbxweb.ProtectedValue,
        s2: string | kdbxweb.ProtectedValue
    ): number {
        if (!s1 || !s2) {
            return 0;
        }
        let ix = indexOf(s1, s2);
        if (ix === 0 && s1.length === s2.length) {
            return 10;
        } else if (ix === 0) {
            return 5;
        } else if (ix > 0) {
            return 3;
        }
        ix = indexOf(s2, s1);
        if (ix === 0) {
            return 5;
        } else if (ix > 0) {
            return 3;
        }
        return 0;
    }
};

function indexOf(
    target: string | kdbxweb.ProtectedValue,
    search: string | kdbxweb.ProtectedValue
): number {
    if (target instanceof kdbxweb.ProtectedValue) {
        if (search instanceof kdbxweb.ProtectedValue) {
            return target.indexOfLower(search.getText());
        }
        return target.indexOfLower(search);
    }
    if (search instanceof kdbxweb.ProtectedValue) {
        return search.indexOfSelfInLower(target);
    }
    return target.indexOf(search);
}

export { Ranking };
